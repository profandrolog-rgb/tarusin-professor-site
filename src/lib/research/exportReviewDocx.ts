import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { stripMarkers } from './markers';

interface RefRow {
  number?: number;
  authors?: string;
  title?: string;
  journal?: string;
  year?: string;
  volume_issue?: string;
  pages?: string;
  doi_or_pmid?: string;
  marker?: string;
}

function htmlToParagraphs(html: string): Paragraph[] {
  const clean = stripMarkers(html || '')
    .replace(/<\/(p|h1|h2|h3|h4|li|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const lines = clean.split(/\n+/).map(s => s.trim()).filter(Boolean);
  return lines.map(text => new Paragraph({ children: [new TextRun({ text, size: 24, font: 'Times New Roman' })], spacing: { after: 120 } }));
}

export async function exportReviewDocx(params: {
  title: string;
  annotation?: string;
  content: string;
  references: RefRow[];
  filename?: string;
}) {
  const { title, annotation, content, references, filename } = params;

  const children: Paragraph[] = [];
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: title || 'Обзор', bold: true, size: 32, font: 'Times New Roman' })],
    spacing: { after: 240 },
  }));
  if (annotation) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Аннотация', bold: true, size: 26, font: 'Times New Roman' })],
      spacing: { after: 120 },
    }));
    children.push(...htmlToParagraphs(annotation));
  }
  children.push(new Paragraph({
    children: [new TextRun({ text: '', size: 24 })], spacing: { after: 120 },
  }));
  children.push(...htmlToParagraphs(content));

  if (references && references.length) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Список литературы', bold: true, size: 28, font: 'Times New Roman' })],
      spacing: { before: 240, after: 120 },
    }));
    references.forEach((r, i) => {
      const parts = [
        r.authors, r.title, r.journal, r.year && r.volume_issue ? `${r.year}; ${r.volume_issue}` : r.year || '', r.pages, r.doi_or_pmid,
      ].filter(Boolean).join('. ');
      children.push(new Paragraph({
        children: [new TextRun({ text: `${r.number ?? i + 1}. ${parts}`, size: 22, font: 'Times New Roman' })],
        spacing: { after: 60 },
      }));
    });
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename || `${(title || 'review').replace(/[^\w.\- ]+/g, '_')}.docx`);
}
