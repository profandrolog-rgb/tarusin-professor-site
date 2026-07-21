import { stripMarkers } from './markers';
import { stripGalleryMarkers } from '@/lib/markdown/galleryMarkers';

const clean = (s: string) => stripGalleryMarkers(stripMarkers(s || ''));

interface RefRow {
  number?: number;
  authors?: string;
  title?: string;
  journal?: string;
  year?: string;
  volume_issue?: string;
  pages?: string;
  doi_or_pmid?: string;
}

/**
 * Готовит скрытый DOM-узел под A4-верстку и рендерит его в PDF через exportNodeToPdf.
 * Маркеры источников удаляются.
 */
export async function exportReviewPdf(params: {
  title: string;
  annotation?: string;
  content: string;
  references: RefRow[];
  filename?: string;
}) {
  const { title, annotation, content, references, filename } = params;

  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;color:#111;font-family:"Times New Roman",serif;padding:40px;';
  root.innerHTML = `
    <h1 style="text-align:center;font-size:22px;margin:0 0 16px">${escapeHtml(title || 'Обзор')}</h1>
    ${annotation ? `<div style="font-style:italic;margin-bottom:16px">${clean(annotation)}</div>` : ''}
    <div style="font-size:14px;line-height:1.55">${clean(content || '')}</div>
    ${references?.length ? `
      <h2 style="font-size:16px;margin-top:24px">Список литературы</h2>
      <ol style="font-size:12px;padding-left:20px">
        ${references.map((r, i) => `<li style="margin-bottom:4px">${escapeHtml([
          r.authors, r.title, r.journal,
          r.year && r.volume_issue ? `${r.year}; ${r.volume_issue}` : r.year || '',
          r.pages, r.doi_or_pmid,
        ].filter(Boolean).join('. '))}</li>`).join('')}
      </ol>` : ''}
  `;
  document.body.appendChild(root);
  try {
    const { exportNodeToPdf } = await import('@/lib/exportPdf');
    await exportNodeToPdf(root, filename || `${(title || 'review').replace(/[^\w.\- ]+/g, '_')}.pdf`);
  } finally {
    document.body.removeChild(root);
  }
}

function escapeHtml(s: string): string {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
