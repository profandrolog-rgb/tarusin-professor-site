import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import PlaceholderGallery from "./PlaceholderGallery";
import ImageGallery from "./ImageGallery";
import {
  splitByProfessorNotes,
  ProfessorNoteBlock,
  type ProfessorNoteIconKey,
} from "@/lib/professorNote";

interface ParsedGallery {
  marker: string; // оригинальная строка маркера
  caption: string;
  files: string[];
}

type Segment =
  | { type: "md"; content: string }
  | { type: "note"; icon: ProfessorNoteIconKey; title: string; content: string }
  | { type: "gallery"; gallery: ParsedGallery };

const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;

function parseGalleryFiles(rest: string): string[] {
  if (!rest) return [];
  return rest
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseArticleContent(content: string, title?: string): Segment[] {
  const prepared = normalizeHorizontalRules(stripDuplicateTitle(content, title));
  const segments: Segment[] = [];
  let lastIndex = 0;
  const re = new RegExp(GALLERY_RE.source, "g");
  let m: RegExpExecArray | null;

  const pushTextSlice = (slice: string) => {
    for (const sub of splitByProfessorNotes(slice)) {
      if (sub.type === "text") {
        segments.push({ type: "md", content: sub.html });
      } else {
        segments.push({
          type: "note",
          icon: sub.icon,
          title: sub.title,
          content: sub.html,
        });
      }
    }
  };

  while ((m = re.exec(prepared)) !== null) {
    if (m.index > lastIndex) {
      pushTextSlice(prepared.slice(lastIndex, m.index));
    }
    segments.push({
      type: "gallery",
      gallery: {
        marker: m[0],
        caption: m[1] || "",
        files: parseGalleryFiles(m[2] || ""),
      },
    });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < prepared.length) {
    pushTextSlice(prepared.slice(lastIndex));
  }
  return segments;
}

interface Props {
  content: string;
  articleId: string;
  articleSlug: string;
  isAdmin: boolean;
  title?: string;
  onContentChange?: (newContent: string) => void;
}

// Ensure `---` on its own line is parsed as a thematic break (<hr>) and not a setext heading.
// Also normalises emphasised / escaped variants produced by TipTap:
//   ***\---***   **---**   ***---***   \-\-\-
function normalizeHorizontalRules(md: string): string {
  let out = md;
  // Strip emphasis wrappers around standalone dashes (with optional backslash-escapes).
  out = out.replace(
    /^[ \t]*[*_~]{1,3}\s*(?:\\?-){3,}\s*[*_~]{1,3}[ \t]*$/gm,
    "---"
  );
  // Standalone backslash-escaped dashes line: \-\-\-
  out = out.replace(/^[ \t]*(?:\\-){3,}[ \t]*$/gm, "---");
  // Standalone plain dashes possibly inside emphasis on same line as text — leave alone.
  // Strip emphasis wrappers around gallery markers: ***[[GALLERY:...]]***
  out = out.replace(
    /[*_~]{1,3}\s*(\[\[GALLERY:[^\]]*\]\])\s*[*_~]{1,3}/g,
    "$1"
  );
  return out
    .replace(/([^\n])\n(-{3,})\s*\n/g, "$1\n\n$2\n\n")
    .replace(/\n(-{3,})\s*\n([^\n])/g, "\n\n$1\n\n$2");
}

function stripDuplicateTitle(md: string, title?: string): string {
  if (!title) return md;
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim();
  const target = normalize(title);
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return md;
  const first = lines[i];
  // ATX heading: # / ## / ###
  const headingMatch = first.match(/^#{1,3}\s+(.+?)\s*#*\s*$/);
  if (headingMatch && normalize(headingMatch[1]) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  // Setext heading: title\n===  or  title\n---
  if (i + 1 < lines.length && /^(=+|-+)\s*$/.test(lines[i + 1]) && normalize(first) === target) {
    lines.splice(i, 2);
    return lines.join("\n");
  }
  // Bold-only paragraph: **Title**
  if (/^\*\*(.+)\*\*\s*$/.test(first.trim()) && normalize(first) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  // Plain text first line equal to title
  if (normalize(first) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  return md;
}


const MarkdownArticle = ({ content, articleId, articleSlug, isAdmin, title, onContentChange }: Props) => {
  const segments = useMemo(
    () => parseArticleContent(content, title),
    [content, title]
  );

  return (
    <div className="article-markdown prose prose-base max-w-none overflow-x-visible text-foreground prose-strong:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic [&_p]:mb-7 [&_p]:leading-[1.85] [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_li]:pl-1 [&_li]:marker:text-foreground">
      {segments.map((seg, i) => {
        if (seg.type === "md") {
          return (
            <ReactMarkdown
              key={i}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              components={{
                hr: () => (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "2px solid #E2EBF5",
                      margin: "32px 0",
                    }}
                  />
                ),
                h1: ({ children }) => (
                  <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#1B4F8A", marginTop: "40px", marginBottom: "16px", lineHeight: 1.3 }}>
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#1B4F8A", marginTop: "40px", marginBottom: "16px", lineHeight: 1.3 }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#1A1A1A", marginTop: "28px", marginBottom: "12px", lineHeight: 1.35 }}>
                    {children}
                  </h3>
                ),
              }}
            >
              {seg.content}
            </ReactMarkdown>
          );
        }
        if (seg.type === "note") {
          return (
            <ProfessorNoteBlock
              key={i}
              icon={seg.icon}
              title={seg.title}
              innerHtml={seg.content}
            />
          );
        }
        const g = seg.gallery;
        if (g.files.length === 0) {
          if (!isAdmin) {
            // Скрываем пустые маркеры от обычных пользователей
            return null;
          }
          return (
            <PlaceholderGallery
              key={i}
              articleId={articleId}
              articleSlug={articleSlug}
              caption={g.caption}
              marker={g.marker}
              fullContent={content}
              onContentChange={onContentChange}
            />
          );
        }
        return (
          <div key={i}>
            <ImageGallery caption={g.caption} files={g.files} />
            {isAdmin && (
              <PlaceholderGallery
                articleId={articleId}
                articleSlug={articleSlug}
                caption={g.caption}
                marker={g.marker}
                fullContent={content}
                existingFiles={g.files}
                onContentChange={onContentChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MarkdownArticle;
