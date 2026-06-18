// Export helpers for Cabinet chat: copy / markdown / docx / pdf.
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import { marked } from "marked";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
} from "docx";

export type ExportMessage = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

const ts = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---------- Markdown ----------
export function messagesToMarkdown(messages: ExportMessage[], title = "Кабинет — диалог"): string {
  const lines: string[] = [`# ${title}`, "", `_${new Date().toLocaleString("ru-RU")}_`, ""];
  for (const m of messages) {
    if (!m.content) continue;
    lines.push(m.role === "user" ? "## 👤 Вопрос" : `## 🤖 Ответ${m.model ? ` (${m.model})` : ""}`);
    lines.push("");
    lines.push(m.content);
    lines.push("");
  }
  return lines.join("\n");
}

export function downloadMarkdown(content: string, filename?: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  saveAs(blob, filename || `cabinet-${ts()}.md`);
}

// ---------- DOCX ----------
// Convert markdown text to docx Paragraphs (simple but solid for Cyrillic clinical text).
function mdToParagraphs(md: string): Paragraph[] {
  const out: Paragraph[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { out.push(new Paragraph({ children: [new TextRun("")] })); continue; }

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const level = [
        HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6,
      ][lvl - 1];
      out.push(new Paragraph({ heading: level, children: [new TextRun({ text: h[2], bold: true })] }));
      continue;
    }
    // Bullets / numbered
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      out.push(new Paragraph({ bullet: { level: 0 }, children: parseInline(bullet[1]) }));
      continue;
    }
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      out.push(new Paragraph({ children: [new TextRun({ text: `• ${numbered[1]}` })] }));
      continue;
    }
    out.push(new Paragraph({ children: parseInline(line) }));
  }
  return out;
}

function parseInline(text: string): TextRun[] {
  // Handle **bold** and *italic* / `code` minimally.
  const runs: TextRun[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index) }));
    const tok = m[0];
    if (tok.startsWith("**")) runs.push(new TextRun({ text: tok.slice(2, -2), bold: true }));
    else if (tok.startsWith("`")) runs.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas" }));
    else runs.push(new TextRun({ text: tok.slice(1, -1), italics: true }));
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs.length ? runs : [new TextRun({ text })];
}

export async function downloadDocx(messages: ExportMessage[], filename?: string, title = "Кабинет — диалог") {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 32 })],
    }),
    new Paragraph({ children: [new TextRun({ text: new Date().toLocaleString("ru-RU"), italics: true, color: "666666" })] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];
  for (const m of messages) {
    if (!m.content) continue;
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({
        text: m.role === "user" ? "Вопрос" : `Ответ${m.model ? ` (${m.model})` : ""}`,
        bold: true,
      })],
    }));
    children.push(...mdToParagraphs(m.content));
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename || `cabinet-${ts()}.docx`);
}

// ---------- PDF ----------
// Use a print window — system fonts handle Cyrillic perfectly, user picks "Save as PDF".
export function downloadPdf(messages: ExportMessage[], title = "Кабинет — диалог") {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) { return false; }
  const body = messages
    .filter((m) => m.content)
    .map((m) => {
      const head = m.role === "user"
        ? "<h2>👤 Вопрос</h2>"
        : `<h2>🤖 Ответ${m.model ? ` <span class="m">(${escapeHtml(m.model)})</span>` : ""}</h2>`;
      const html = marked.parse(m.content, { async: false }) as string;
      return `<section>${head}${html}</section>`;
    })
    .join("\n");
  w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #111; line-height: 1.5; font-size: 12pt; }
  h1 { font-size: 18pt; margin: 0 0 4pt; }
  h2 { font-size: 13pt; margin: 14pt 0 4pt; border-bottom: 1px solid #ddd; padding-bottom: 2pt; }
  h3 { font-size: 12pt; margin: 10pt 0 3pt; }
  .meta { color: #666; font-style: italic; margin-bottom: 14pt; }
  .m { color: #888; font-weight: normal; font-size: 10pt; }
  section { page-break-inside: avoid; margin-bottom: 10pt; }
  pre, code { font-family: Consolas, Menlo, monospace; font-size: 10.5pt; background: #f5f5f5; padding: 1pt 3pt; border-radius: 3px; }
  pre { padding: 8pt; overflow-x: auto; }
  table { border-collapse: collapse; margin: 6pt 0; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; }
  ul, ol { padding-left: 20pt; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${escapeHtml(new Date().toLocaleString("ru-RU"))}</div>
${body}
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 250); });<\/script>
</body></html>`);
  w.document.close();
  return true;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
