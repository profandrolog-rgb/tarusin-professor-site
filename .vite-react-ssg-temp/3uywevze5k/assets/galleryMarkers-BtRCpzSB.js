import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;
const GALLERY_DIV_RE = /<div\b(?=[^>]*(?:\bdata-gallery-placeholder(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?|\bdata-type\s*=\s*(?:"galleryPlaceholder"|'galleryPlaceholder'|galleryPlaceholder)))([^>]*)>[\s\S]*?<\/div>/gi;
marked.setOptions({ gfm: true, breaks: false });
function markdownToHtml(md) {
  if (!md) return "";
  const prepared = md.replace(
    GALLERY_RE,
    (_m, caption, files) => `

<div data-gallery-placeholder data-caption="${escapeHtml(caption)}" data-files="${escapeHtml((files || "").replace(/^\|/, "").trim())}">Галерея</div>

`
  );
  return marked.parse(prepared, { async: false });
}
function readHtmlAttr(attrs, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return decodeHtml((m == null ? void 0 : m[1]) || (m == null ? void 0 : m[2]) || (m == null ? void 0 : m[3]) || "");
}
function galleryDivsToMarkers(html) {
  return html.replace(
    GALLERY_DIV_RE,
    (_m, attrs) => {
      const caption = readHtmlAttr(attrs, "data-caption").replace(/"/g, "'");
      const files = readHtmlAttr(attrs, "data-files").split("|").map((s) => s.trim()).filter(Boolean).join("|");
      return `

<p>[[GALLERY: caption="${caption}"${files ? `|${files}` : ""}]]</p>

`;
    }
  );
}
const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*"
});
turndownService.use(gfm);
turndownService.addRule("galleryPlaceholder", {
  filter: (node) => node.nodeType === 1 && node.getAttribute && (node.getAttribute("data-gallery-placeholder") !== null || node.getAttribute("data-type") === "galleryPlaceholder"),
  replacement: (_content, node) => {
    const caption = node.getAttribute("data-caption") || "";
    const files = (node.getAttribute("data-files") || "").trim();
    return `

[[GALLERY: caption="${caption.replace(/"/g, "'")}"${files ? `|${files}` : ""}]]

`;
  }
});
turndownService.addRule("galleryTextMarker", {
  filter: (node) => {
    if (node.nodeType !== 1) return false;
    const el = node;
    if (el.tagName !== "P") return false;
    const text = (el.textContent || "").trim();
    return /^\[\[GALLERY:\s*caption\s*=\s*["'“”][^"'“”]*["'“”]\s*(?:\|[^\]]*)?\]\]$/.test(text);
  },
  replacement: (_content, node) => {
    const text = (node.textContent || "").trim();
    return `

${text}

`;
  }
});
function htmlToMarkdown(html) {
  if (!html) return "";
  return turndownService.turndown(galleryDivsToMarkers(html)).trim();
}
function parseGalleryFiles(raw) {
  return (raw || "").split("|").map((s) => s.trim()).filter(Boolean);
}
function parseGalleryFileEntry(raw) {
  const s = raw.trim();
  const m = s.match(/^(\S+)\s+["'“”]([^"'“”]*)["'“”]\s*$/);
  if (m) return { filename: m[1], caption: m[2].trim() };
  return { filename: s, caption: "" };
}
function parseGalleryFileEntries(raw) {
  return parseGalleryFiles(raw).map(parseGalleryFileEntry);
}
function galleryFileKey(entry) {
  return entry.trim().split(/\s+/)[0] || entry.trim();
}
function mergeFileEntries(draftFiles, persistedFiles) {
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
function extractGallerySnapshots(content) {
  const byCaption = /* @__PURE__ */ new Map();
  if (!content) return byCaption;
  const markerRe = new RegExp(GALLERY_RE.source, "g");
  let marker;
  while ((marker = markerRe.exec(content)) !== null) {
    const caption = marker[1] || "";
    const files = parseGalleryFiles(marker[2] || "");
    if (files.length > 0 && !byCaption.has(caption)) byCaption.set(caption, { caption, files });
  }
  const divRe = new RegExp(GALLERY_DIV_RE.source, "gi");
  let div;
  while ((div = divRe.exec(content)) !== null) {
    const attrs = div[1] || "";
    const caption = readHtmlAttr(attrs, "data-caption");
    const files = parseGalleryFiles(readHtmlAttr(attrs, "data-files"));
    if (caption && files.length > 0 && !byCaption.has(caption)) byCaption.set(caption, { caption, files });
  }
  return byCaption;
}
function buildGalleryMarker(caption, files) {
  const safeCaption = caption.replace(/"/g, "'");
  return `[[GALLERY: caption="${safeCaption}"${files.length ? ` | ${files.join(" | ")}` : ""}]]`;
}
function formatGalleryFileEntry(entry) {
  const safeCaption = (entry.caption || "").replace(/"/g, "”").replace(/\|/g, "／");
  return safeCaption ? `${entry.filename} "${safeCaption}"` : entry.filename;
}
function buildGalleryMarkerFromEntries(caption, entries) {
  return buildGalleryMarker(caption, entries.map(formatGalleryFileEntry));
}
function readGalleryEntriesFromContent(content, caption) {
  if (!content) return [];
  const markerRe = new RegExp(GALLERY_RE.source, "g");
  let marker;
  while ((marker = markerRe.exec(content)) !== null) {
    if ((marker[1] || "") === caption) return parseGalleryFileEntries(marker[2] || "");
  }
  const divRe = new RegExp(GALLERY_DIV_RE.source, "gi");
  let div;
  while ((div = divRe.exec(content)) !== null) {
    const attrs = div[1] || "";
    if (readHtmlAttr(attrs, "data-caption") === caption) {
      return parseGalleryFileEntries(readHtmlAttr(attrs, "data-files"));
    }
  }
  return [];
}
function upsertGalleryEntriesInContent(content, caption, entries, exactMarker) {
  const newMarker = buildGalleryMarkerFromEntries(caption, entries);
  if (exactMarker && content.includes(exactMarker)) {
    return { content: content.split(exactMarker).join(newMarker), found: true };
  }
  let found = false;
  let next = content.replace(GALLERY_RE, (match, markerCaption) => {
    if ((markerCaption || "") !== caption) return match;
    found = true;
    return newMarker;
  });
  next = next.replace(GALLERY_DIV_RE, (match, attrs) => {
    if (readHtmlAttr(attrs, "data-caption") !== caption) return match;
    found = true;
    return newMarker;
  });
  return found ? { content: next, found } : { content: `${content}

${newMarker}`, found: false };
}
function mergePersistedGalleryFiles(draftContent, persistedContent) {
  if (!draftContent || !persistedContent) return draftContent;
  const persisted = extractGallerySnapshots(persistedContent);
  if (persisted.size === 0) return draftContent;
  const mergeMarker = (_match, caption, rawFiles) => {
    const saved = persisted.get(caption || "");
    if (!(saved == null ? void 0 : saved.files.length)) return _match;
    const draftFiles = parseGalleryFiles(rawFiles || "");
    const merged = mergeFileEntries(draftFiles, saved.files);
    return merged.length === draftFiles.length ? _match : buildGalleryMarker(caption || "", merged);
  };
  return draftContent.replace(GALLERY_RE, mergeMarker).replace(GALLERY_DIV_RE, (_match, attrs) => {
    const caption = readHtmlAttr(attrs, "data-caption");
    const saved = persisted.get(caption || "");
    if (!caption || !(saved == null ? void 0 : saved.files.length)) return _match;
    const draftFiles = parseGalleryFiles(readHtmlAttr(attrs, "data-files"));
    const merged = mergeFileEntries(draftFiles, saved.files).join("|");
    return _match.replace(/\sdata-files\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/i, "").replace(
      /<div\b/i,
      `<div data-files="${escapeHtml(merged)}"`
    );
  });
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function decodeHtml(s) {
  return s.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
export {
  mergePersistedGalleryFiles as a,
  htmlToMarkdown as h,
  markdownToHtml as m,
  parseGalleryFileEntries as p,
  readGalleryEntriesFromContent as r,
  upsertGalleryEntriesInContent as u
};
