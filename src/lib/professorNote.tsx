import DOMPurify from "dompurify";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  FileText,
  HeartPulse,
  Lightbulb,
  Microscope,
  Quote,
  Stethoscope,
  Star,
  type LucideIcon,
} from "lucide-react";

export type ProfessorNoteIconKey =
  | "stethoscope"
  | "lightbulb"
  | "quote"
  | "heart-pulse"
  | "microscope"
  | "alert-triangle"
  | "star"
  | "book-open"
  | "file-text"
  | "brain";

export const PROFESSOR_NOTE_ICONS: {
  key: ProfessorNoteIconKey;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "stethoscope", label: "Стетоскоп", Icon: Stethoscope },
  { key: "lightbulb", label: "Идея", Icon: Lightbulb },
  { key: "quote", label: "Цитата", Icon: Quote },
  { key: "heart-pulse", label: "Клиника", Icon: HeartPulse },
  { key: "microscope", label: "Микроскоп", Icon: Microscope },
  { key: "alert-triangle", label: "Внимание", Icon: AlertTriangle },
  { key: "star", label: "Важно", Icon: Star },
  { key: "book-open", label: "Литература", Icon: BookOpen },
  { key: "file-text", label: "Документ", Icon: FileText },
  { key: "brain", label: "Размышление", Icon: Brain },
];

export const DEFAULT_PROFESSOR_NOTE_ICON: ProfessorNoteIconKey = "stethoscope";

export function getProfessorNoteIcon(key?: string) {
  return (
    PROFESSOR_NOTE_ICONS.find((i) => i.key === key) ?? PROFESSOR_NOTE_ICONS[0]
  );
}

const PROFESSOR_NOTE_RE =
  /<aside\b(?=[^>]*\bclass\s*=\s*["'][^"']*\bprofessor-note\b[^"']*["'])([^>]*)>([\s\S]*?)<\/aside>/gi;

function readHtmlAttr(attrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
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

export type ProfessorNoteSegment =
  | { type: "text"; html: string }
  | { type: "note"; html: string; icon: ProfessorNoteIconKey; title: string };

export function splitByProfessorNotes(html: string): ProfessorNoteSegment[] {
  const out: ProfessorNoteSegment[] = [];
  if (!html) return out;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(PROFESSOR_NOTE_RE.source, "gi");
  while ((m = re.exec(html)) !== null) {
    if (m.index > lastIndex) {
      out.push({ type: "text", html: html.slice(lastIndex, m.index) });
    }
    const attrs = m[1] || "";
    const icon =
      (readHtmlAttr(attrs, "data-icon") as ProfessorNoteIconKey) ||
      DEFAULT_PROFESSOR_NOTE_ICON;
    const title = readHtmlAttr(attrs, "data-title") || "";
    out.push({ type: "note", html: m[2], icon, title });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < html.length) {
    out.push({ type: "text", html: html.slice(lastIndex) });
  }
  return out;
}

interface ProfessorNoteBlockProps {
  icon: ProfessorNoteIconKey;
  title: string;
  innerHtml: string;
  className?: string;
}

export const ProfessorNoteBlock = ({
  icon,
  title,
  innerHtml,
  className = "",
}: ProfessorNoteBlockProps) => {
  const { Icon } = getProfessorNoteIcon(icon);
  const clean = DOMPurify.sanitize(innerHtml, {
    ADD_ATTR: ["style", "data-note", "data-icon", "data-title"],
  });
  return (
    <aside
      className={`professor-note ${className}`}
      data-note
      data-icon={icon}
      data-title={title}
    >
      <div className="professor-note-header">
        <Icon className="professor-note-icon" aria-hidden="true" />
        {title && <span className="professor-note-title">{title}</span>}
      </div>
      <div
        className="professor-note-body"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </aside>
  );
};
