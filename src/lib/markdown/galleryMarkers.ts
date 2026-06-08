import { marked } from "marked";
import TurndownService from "turndown";

const GALLERY_RE = /\[\[GALLERY:\s*caption="([^"]*)"\]\]/g;

marked.setOptions({ gfm: true, breaks: false });

export function markdownToHtml(md: string): string {
  if (!md) return "";
  // Replace gallery markers with HTML placeholders BEFORE markdown parsing.
  // Wrapped in their own paragraphs (blank lines) so marked treats them as block-level.
  const prepared = md.replace(
    GALLERY_RE,
    (_m, caption: string) =>
      `\n\n<div data-gallery-placeholder data-caption="${escapeHtml(caption)}"></div>\n\n`
  );
  return marked.parse(prepared, { async: false }) as string;
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

export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  return turndownService.turndown(html).trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
