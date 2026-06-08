import { marked } from "marked";
import TurndownService from "turndown";

const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*(["'“”])([^"'“”]*)\1\s*((?:\|[^\]]*)?)\]\]/g;

marked.setOptions({ gfm: true, breaks: false });

export function markdownToHtml(md: string): string {
  if (!md) return "";
  // Replace gallery markers with HTML placeholders BEFORE markdown parsing.
  // Wrapped in their own paragraphs (blank lines) so marked treats them as block-level.
  const prepared = md.replace(
    GALLERY_RE,
    (_m, _quote: string, caption: string, files: string) =>
      `\n\n<div data-gallery-placeholder data-caption="${escapeHtml(caption)}" data-files="${escapeHtml((files || "").replace(/^\|/, ""))}">Галерея</div>\n\n`
  );
  return marked.parse(prepared, { async: false }) as string;
}

function readHtmlAttr(attrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return decodeHtml(m?.[1] || m?.[2] || m?.[3] || "");
}

function galleryDivsToMarkers(html: string): string {
  return html.replace(
    /<div\b(?=[^>]*\bdata-gallery-placeholder(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)([^>]*)>[\s\S]*?<\/div>/gi,
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

turndownService.addRule("galleryPlaceholder", {
  filter: (node) =>
    node.nodeType === 1 &&
    (node as HTMLElement).getAttribute &&
    (node as HTMLElement).getAttribute("data-gallery-placeholder") !== null,
  replacement: (_content, node) => {
    const caption = (node as HTMLElement).getAttribute("data-caption") || "";
    return `\n\n[[GALLERY: caption="${caption.replace(/"/g, "'")}"]]\n\n`;
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
    return /^\[\[GALLERY:\s*caption\s*=\s*["“”][^"“”]*["“”]\s*(?:\|[^\]]*)?\]\]$/.test(text);
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
