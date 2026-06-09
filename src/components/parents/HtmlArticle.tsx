import { useMemo } from "react";
import DOMPurify from "dompurify";
import PlaceholderGallery from "./PlaceholderGallery";
import ImageGallery from "./ImageGallery";

interface Props {
  content: string;
  articleId: string;
  articleSlug: string;
  isAdmin: boolean;
  title?: string;
  onContentChange?: (newContent: string) => void;
}

const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]|<div\b(?=[^>]*(?:\bdata-gallery-placeholder(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?|\bdata-type\s*=\s*(?:"galleryPlaceholder"|'galleryPlaceholder'|galleryPlaceholder)))([^>]*)>[\s\S]*?<\/div>/gi;

const HR_HTML =
  '<hr style="border:none;border-top:2px solid #E2EBF5;margin:32px 0;" />';
const HR_STYLE = "border:none;border-top:2px solid #E2EBF5;margin:32px 0;";
const H2_STYLE = "font-size:26px;font-weight:700;color:#1B4F8A;margin-top:40px;margin-bottom:16px;line-height:1.3;";
const H3_STYLE = "font-size:20px;font-weight:600;color:#333;margin-top:28px;margin-bottom:12px;line-height:1.35;";

function readHtmlAttr(attrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return (m?.[1] || m?.[2] || m?.[3] || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function withInlineStyle(attrs: string, style: string): string {
  return `${attrs.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "")} style="${style}"`;
}

/**
 * Convert various editor encodings of a horizontal rule into a real <hr>.
 * Tiptap often stores "---" wrapped in <em>/<strong> or as a plain text line.
 */
function normalizeHr(html: string): string {
  let out = html;

  // <p>...---...</p> where the *only* visible content is dashes
  out = out.replace(/<p[^>]*>\s*(?:<(?:strong|em|b|i)>\s*)*-{3,}\s*(?:<\/(?:strong|em|b|i)>\s*)*<\/p>/gi, HR_HTML);

  // Stand-alone <em>---</em> / <strong>---</strong> chains (e.g. inside a heading)
  out = out.replace(/(?:<(?:strong|em|b|i)>\s*)+-{3,}(?:\s*<\/(?:strong|em|b|i)>)+/gi, HR_HTML);

  // <br>---<br> patterns
  out = out.replace(/<br\s*\/?>\s*-{3,}\s*<br\s*\/?>/gi, HR_HTML);

  // Trailing "---" left over inside a heading after stripping wrappers
  out = out.replace(/(<h[1-6][^>]*>)([\s\S]*?)<br\s*\/?>\s*-{3,}\s*(<\/h[1-6]>)/gi, "$1$2$3" + HR_HTML);

  return out;
}

function applyArticleStyles(html: string): string {
  return html
    .replace(/<hr\b[^>]*\/?\s*>/gi, `<hr style="${HR_STYLE}" />`)
    .replace(/<h2\b([^>]*)>/gi, (_m, attrs: string) => `<h2${withInlineStyle(attrs, H2_STYLE)}>`)
    .replace(/<h3\b([^>]*)>/gi, (_m, attrs: string) => `<h3${withInlineStyle(attrs, H3_STYLE)}>`);
}

/** Remove the first heading / bold paragraph if it duplicates the article title. */
function stripDuplicateTitle(html: string, title?: string): string {
  if (!title) return html;
  const norm = (s: string) =>
    s
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const target = norm(title);
  const duplicatesTitle = (s: string) => {
    const value = norm(s);
    return (
      value === target ||
      value.startsWith(`${target}:`) ||
      value.startsWith(`${target} —`) ||
      value.startsWith(`${target} -`)
    );
  };

  const patterns = [
    /^\s*<h1\b[^>]*>([\s\S]*?)<\/h1>/i,
    /^\s*<h2\b[^>]*>([\s\S]*?)<\/h2>/i,
    /^\s*<p\b[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/p>/i,
    /^\s*<p\b[^>]*>([\s\S]*?)<\/p>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && duplicatesTitle(m[1])) {
      return html.replace(re, "");
    }
  }
  return html;
}

interface Segment {
  type: "html" | "gallery";
  html?: string;
  caption?: string;
  marker?: string;
  files?: string[];
}

function splitOnGalleryMarkers(html: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  const re = new RegExp(GALLERY_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) segments.push({ type: "html", html: html.slice(last, m.index) });
    const isTextMarker = m[1] !== undefined;
    const caption = isTextMarker ? m[1] || "" : readHtmlAttr(m[3] || "", "data-caption");
    const files = (isTextMarker ? m[2] || "" : readHtmlAttr(m[3] || "", "data-files"))
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    segments.push({ type: "gallery", marker: m[0], caption, files });
    last = m.index + m[0].length;
  }
  if (last < html.length) segments.push({ type: "html", html: html.slice(last) });
  return segments;
}

const ARTICLE_CLASS =
  "prose prose-base max-w-none overflow-x-visible text-foreground " +
  "[&_p]:mb-7 [&_p]:leading-[1.85] " +
  "[&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-[#1B4F8A] [&_h1]:leading-tight " +
  "[&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#1B4F8A] [&_h2]:leading-tight " +
  "[&_h3]:text-[20px] [&_h3]:font-semibold [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-[#1A1A1A] [&_h3]:leading-snug " +
  "[&_hr]:border-0 [&_hr]:border-t-2 [&_hr]:border-[#E2EBF5] [&_hr]:my-8 " +
  "[&_img]:rounded-lg [&_img]:mx-auto [&_img]:max-w-full [&_img]:h-auto [&_img]:block " +
  "[&_table]:w-full [&_table]:border-collapse [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_th]:border-border [&_td]:p-2 [&_td]:border [&_td]:border-border";

const HtmlArticle = ({ content, articleId, articleSlug, isAdmin, title, onContentChange }: Props) => {
  const segments = useMemo(() => {
    const normalized = applyArticleStyles(normalizeHr(stripDuplicateTitle(content, title)));
    return splitOnGalleryMarkers(normalized);
  }, [content, title]);

  return (
    <div className="overflow-x-visible" onCopy={(e) => e.preventDefault()}>
      {segments.map((seg, i) => {
        if (seg.type === "html") {
          return (
            <div
              key={i}
              className={ARTICLE_CLASS}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(seg.html || "", { ADD_ATTR: ["style"] }),
              }}
            />
          );
        }
        if ((seg.files?.length || 0) === 0) {
          if (!isAdmin) return null;
          return (
            <PlaceholderGallery
              key={i}
              articleId={articleId}
              articleSlug={articleSlug}
              caption={seg.caption || ""}
              marker={seg.marker || ""}
              fullContent={content}
              onContentChange={onContentChange}
            />
          );
        }
        return (
          <div key={i}>
            <ImageGallery caption={seg.caption || ""} files={seg.files || []} />
            {isAdmin && (
              <PlaceholderGallery
                articleId={articleId}
                articleSlug={articleSlug}
                caption={seg.caption || ""}
                marker={seg.marker || ""}
                fullContent={content}
                existingFiles={seg.files || []}
                onContentChange={onContentChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HtmlArticle;
