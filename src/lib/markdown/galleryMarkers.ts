import { marked } from "marked";
import TurndownService from "turndown";
// @ts-ignore - turndown-plugin-gfm has no types but exports `gfm`
import { gfm as turndownGfm } from "turndown-plugin-gfm";

export const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;
export const GALLERY_DIV_RE = /<div\b(?=[^>]*(?:\bdata-gallery-placeholder(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?|\bdata-type\s*=\s*(?:"galleryPlaceholder"|'galleryPlaceholder'|galleryPlaceholder)))([^>]*)>[\s\S]*?<\/div>/gi;

/** Сегмент HTML/markdown-контента: либо кусок текста, либо распознанная галерея. */
export type GallerySegment =
  | { type: "text"; content: string }
  | { type: "gallery"; marker: string; caption: string; files: string[] };

/**
 * Разбивает произвольный контент (HTML или markdown) на сегменты по маркерам галерей.
 * Понимает и текстовые маркеры [[GALLERY: ...]], и HTML-плейсхолдеры
 * <div data-gallery-placeholder data-caption="..." data-files="...">.
 * Используется одинаково в статьях для родителей и научных обзорах.
 */
export function splitContentByGallery(content: string): GallerySegment[] {
  if (!content) return [];
  type Hit = { start: number; end: number; caption: string; files: string[]; marker: string };
  const hits: Hit[] = [];

  const textRe = new RegExp(GALLERY_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(content)) !== null) {
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      caption: m[1] || "",
      files: (m[2] || "").split("|").map((s) => s.trim()).filter(Boolean),
      marker: m[0],
    });
  }

  const divRe = new RegExp(GALLERY_DIV_RE.source, "gi");
  let d: RegExpExecArray | null;
  while ((d = divRe.exec(content)) !== null) {
    const attrs = d[1] || "";
    hits.push({
      start: d.index,
      end: d.index + d[0].length,
      caption: readHtmlAttr(attrs, "data-caption"),
      files: readHtmlAttr(attrs, "data-files").split("|").map((s) => s.trim()).filter(Boolean),
      marker: d[0],
    });
  }

  hits.sort((a, b) => a.start - b.start);

  const out: GallerySegment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start < cursor) continue; // защита от пересечений
    if (h.start > cursor) out.push({ type: "text", content: content.slice(cursor, h.start) });
    out.push({ type: "gallery", marker: h.marker, caption: h.caption, files: h.files });
    cursor = h.end;
  }
  if (cursor < content.length) out.push({ type: "text", content: content.slice(cursor) });
  return out;
}

/** Убирает все маркеры галерей из текста/HTML (для экспорта в форматы без картинок). */
export function stripGalleryMarkers(content: string): string {
  if (!content) return "";
  return content.replace(GALLERY_RE, "").replace(GALLERY_DIV_RE, "");
}

marked.setOptions({ gfm: true, breaks: false });

// Защита маркеров источников [M#] при конвертации: и marked, и Turndown могут
// экранировать/пожирать квадратные скобки. Перед парсингом заменяем маркеры на
// уникальные токены с приватными Unicode-символами, после — возвращаем.
const MARKER_TOKEN_PREFIX = "\uE050SRCMRK\uE051";
const MARKER_TOKEN_SUFFIX = "\uE052";
const SOURCE_MARKER_RE = /\[M(\d+)\]/g;

function protectSourceMarkers(input: string): string {
  if (!input) return input;
  return input.replace(SOURCE_MARKER_RE, (_m, n) => `${MARKER_TOKEN_PREFIX}${n}${MARKER_TOKEN_SUFFIX}`);
}
function unprotectSourceMarkers(input: string): string {
  if (!input) return input;
  const re = new RegExp(
    `${MARKER_TOKEN_PREFIX.replace(/[\uE050\uE051\uE052]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)}(\\d+)${MARKER_TOKEN_SUFFIX.replace(/[\uE050\uE051\uE052]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)}`,
    "g",
  );
  return input.replace(re, (_m, n) => `[M${n}]`);
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  // Защищаем [M#] от возможной интерпретации marked как ссылки/сноски.
  const protectedMd = protectSourceMarkers(md);
  // Replace gallery markers with HTML placeholders BEFORE markdown parsing.
  // Wrapped in their own paragraphs (blank lines) so marked treats them as block-level.
  const prepared = protectedMd.replace(
    GALLERY_RE,
    (_m, caption: string, files: string) =>
      `\n\n<div data-gallery-placeholder data-caption="${escapeHtml(caption)}" data-files="${escapeHtml((files || "").replace(/^\|/, "").trim())}">Галерея</div>\n\n`
  );
  const html = marked.parse(prepared, { async: false }) as string;
  return unprotectSourceMarkers(html);
}

function readHtmlAttr(attrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return decodeHtml(m?.[1] || m?.[2] || m?.[3] || "");
}

function galleryDivsToMarkers(html: string): string {
  return html.replace(
    GALLERY_DIV_RE,
    (_m, attrs: string) => {
      const caption = readHtmlAttr(attrs, "data-caption").replace(/"/g, "'");
      const files = readHtmlAttr(attrs, "data-files")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .join("|");
      return `\n\n<p>[[GALLERY: caption="${caption}"${files ? `|${files}` : ""}]]</p>\n\n`;
    }
  );
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});
turndownService.use(turndownGfm);

turndownService.addRule("galleryPlaceholder", {
  filter: (node) =>
    node.nodeType === 1 &&
    (node as HTMLElement).getAttribute &&
    ((node as HTMLElement).getAttribute("data-gallery-placeholder") !== null ||
      (node as HTMLElement).getAttribute("data-type") === "galleryPlaceholder"),
  replacement: (_content, node) => {
    const caption = (node as HTMLElement).getAttribute("data-caption") || "";
    const files = ((node as HTMLElement).getAttribute("data-files") || "").trim();
    return `\n\n[[GALLERY: caption="${caption.replace(/"/g, "'")}"${files ? `|${files}` : ""}]]\n\n`;
  },
});
// Some content slips in as a plain <p>[[GALLERY: caption="..."]]</p> paragraph
// (e.g. when the editor was bypassed, or when content came from external paste).
// Turndown would otherwise escape brackets/quotes ("\[\[GALLERY: caption=\"..\"\]\]")
// which prevents our renderer from picking it up.
turndownService.addRule("galleryTextMarker", {
  filter: (node) => {
    if (node.nodeType !== 1) return false;
    const el = node as HTMLElement;
    if (el.tagName !== "P") return false;
    const text = (el.textContent || "").trim();
    return /^\[\[GALLERY:\s*caption\s*=\s*["'“”][^"'“”]*["'“”]\s*(?:\|[^\]]*)?\]\]$/.test(text);
  },
  replacement: (_content, node) => {
    const text = ((node as HTMLElement).textContent || "").trim();
    return `\n\n${text}\n\n`;
  },
});


export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndownService.turndown(galleryDivsToMarkers(html)).trim();
}

type GallerySnapshot = {
  caption: string;
  files: string[];
};

export type GalleryFileEntry = {
  filename: string;
  caption: string;
};

function parseGalleryFiles(raw: string): string[] {
  return (raw || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseGalleryFileEntry(raw: string): GalleryFileEntry {
  const s = raw.trim();
  const m = s.match(/^(\S+)\s+["'“”]([^"'“”]*)["'“”]\s*$/);
  if (m) return { filename: m[1], caption: m[2].trim() };
  return { filename: s, caption: "" };
}

export function parseGalleryFileEntries(raw: string): GalleryFileEntry[] {
  return parseGalleryFiles(raw).map(parseGalleryFileEntry);
}

function galleryFileKey(entry: string): string {
  return entry.trim().split(/\s+/)[0] || entry.trim();
}

function mergeFileEntries(draftFiles: string[], persistedFiles: string[]): string[] {
  const seen = new Set(draftFiles.map(galleryFileKey));
  const merged = [...draftFiles];
  for (const file of persistedFiles) {
    const key = galleryFileKey(file);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(file);
  }
  return merged;
}

function extractGallerySnapshots(content: string): Map<string, GallerySnapshot> {
  const byCaption = new Map<string, GallerySnapshot>();
  if (!content) return byCaption;

  const markerRe = new RegExp(GALLERY_RE.source, "g");
  let marker: RegExpExecArray | null;
  while ((marker = markerRe.exec(content)) !== null) {
    const caption = marker[1] || "";
    const files = parseGalleryFiles(marker[2] || "");
    if (files.length > 0 && !byCaption.has(caption)) byCaption.set(caption, { caption, files });
  }

  const divRe = new RegExp(GALLERY_DIV_RE.source, "gi");
  let div: RegExpExecArray | null;
  while ((div = divRe.exec(content)) !== null) {
    const attrs = div[1] || "";
    const caption = readHtmlAttr(attrs, "data-caption");
    const files = parseGalleryFiles(readHtmlAttr(attrs, "data-files"));
    if (caption && files.length > 0 && !byCaption.has(caption)) byCaption.set(caption, { caption, files });
  }

  return byCaption;
}

function buildGalleryMarker(caption: string, files: string[]): string {
  const safeCaption = caption.replace(/"/g, "'");
  return `[[GALLERY: caption="${safeCaption}"${files.length ? ` | ${files.join(" | ")}` : ""}]]`;
}

function formatGalleryFileEntry(entry: GalleryFileEntry): string {
  const safeCaption = (entry.caption || "").replace(/"/g, "”").replace(/\|/g, "／");
  return safeCaption ? `${entry.filename} "${safeCaption}"` : entry.filename;
}

export function buildGalleryMarkerFromEntries(caption: string, entries: GalleryFileEntry[]): string {
  return buildGalleryMarker(caption, entries.map(formatGalleryFileEntry));
}

export function readGalleryEntriesFromContent(content: string, caption: string): GalleryFileEntry[] {
  if (!content) return [];
  const markerRe = new RegExp(GALLERY_RE.source, "g");
  let marker: RegExpExecArray | null;
  while ((marker = markerRe.exec(content)) !== null) {
    if ((marker[1] || "") === caption) return parseGalleryFileEntries(marker[2] || "");
  }

  const divRe = new RegExp(GALLERY_DIV_RE.source, "gi");
  let div: RegExpExecArray | null;
  while ((div = divRe.exec(content)) !== null) {
    const attrs = div[1] || "";
    if (readHtmlAttr(attrs, "data-caption") === caption) {
      return parseGalleryFileEntries(readHtmlAttr(attrs, "data-files"));
    }
  }
  return [];
}

export function upsertGalleryEntriesInContent(
  content: string,
  caption: string,
  entries: GalleryFileEntry[],
  exactMarker?: string,
): { content: string; found: boolean } {
  const newMarker = buildGalleryMarkerFromEntries(caption, entries);
  if (exactMarker && content.includes(exactMarker)) {
    return { content: content.split(exactMarker).join(newMarker), found: true };
  }

  let found = false;
  let next = content.replace(GALLERY_RE, (match, markerCaption: string) => {
    if ((markerCaption || "") !== caption) return match;
    found = true;
    return newMarker;
  });

  next = next.replace(GALLERY_DIV_RE, (match, attrs: string) => {
    if (readHtmlAttr(attrs, "data-caption") !== caption) return match;
    found = true;
    return newMarker;
  });

  return found ? { content: next, found } : { content: `${content}\n\n${newMarker}`, found: false };
}

/**
 * Prevents stale article editor drafts from deleting already-uploaded gallery files.
 * The text being saved wins for normal article content, while persisted gallery file
 * lists are merged back by caption before the database update.
 */
export function mergePersistedGalleryFiles(draftContent: string, persistedContent: string): string {
  if (!draftContent || !persistedContent) return draftContent;
  const persisted = extractGallerySnapshots(persistedContent);
  if (persisted.size === 0) return draftContent;

  const mergeMarker = (_match: string, caption: string, rawFiles: string) => {
    const saved = persisted.get(caption || "");
    if (!saved?.files.length) return _match;
    const draftFiles = parseGalleryFiles(rawFiles || "");
    const merged = mergeFileEntries(draftFiles, saved.files);
    return merged.length === draftFiles.length ? _match : buildGalleryMarker(caption || "", merged);
  };

  return draftContent
    .replace(GALLERY_RE, mergeMarker)
    .replace(GALLERY_DIV_RE, (_match, attrs: string) => {
      const caption = readHtmlAttr(attrs, "data-caption");
      const saved = persisted.get(caption || "");
      if (!caption || !saved?.files.length) return _match;
      const draftFiles = parseGalleryFiles(readHtmlAttr(attrs, "data-files"));
      const merged = mergeFileEntries(draftFiles, saved.files).join("|");
      return _match.replace(/\sdata-files\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/i, "").replace(
        /<div\b/i,
        `<div data-files="${escapeHtml(merged)}"`,
      );
    });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
