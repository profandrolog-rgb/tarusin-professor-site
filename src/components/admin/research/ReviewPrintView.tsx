import { forwardRef } from 'react';
import { stripMarkers } from '@/lib/research/markers';
import { splitContentByGallery } from '@/lib/markdown/galleryMarkers';

interface Props {
  title: string;
  annotation?: string;
  content: string;
  references: any[];
  authorName?: string;
}

const BUCKET = 'disease-media';
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/article-images`;

function publicUrl(filename: string) {
  return `${STORAGE_BASE}/${filename.split('/').map(encodeURIComponent).join('/')}`;
}

function parseEntry(raw: string): { filename: string; caption: string } {
  const s = raw.trim();
  const m = s.match(/^(\S+)\s+["'“”]([^"'“”]*)["'“”]\s*$/);
  if (m) return { filename: m[1], caption: m[2].trim() };
  return { filename: s, caption: '' };
}

/** Скрытый DOM-узел для печати. Виден только при @media print. */
const ReviewPrintView = forwardRef<HTMLDivElement, Props>(({ title, annotation, content, references, authorName }, ref) => {
  const segments = splitContentByGallery(stripMarkers(content || ''));

  return (
    <div ref={ref} className="review-print-root" aria-hidden>
      <div className="review-print">
        <header>
          <h1>{title || 'Обзор'}</h1>
          {authorName && <div className="review-print-author">{authorName}</div>}
          <div className="review-print-date">{new Date().toLocaleDateString('ru-RU')}</div>
        </header>
        {annotation && (
          <section>
            <h2>Аннотация</h2>
            <div dangerouslySetInnerHTML={{ __html: stripMarkers(annotation) }} />
          </section>
        )}
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <section key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />;
          }
          if (!seg.files.length) return null;
          const items = seg.files.map(parseEntry);
          return (
            <figure key={i} className="review-print-gallery" style={{ margin: '16px 0' }}>
              {seg.caption && <figcaption style={{ fontWeight: 600, marginBottom: 8 }}>{seg.caption}</figcaption>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {items.map((it, j) => (
                  <div key={j} style={{ maxWidth: 260 }}>
                    <img src={publicUrl(it.filename)} alt={it.caption || seg.caption} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                    {it.caption && <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>{it.caption}</div>}
                  </div>
                ))}
              </div>
            </figure>
          );
        })}
        {references?.length ? (
          <section>
            <h2>Список литературы</h2>
            <ol>
              {references.map((r, i) => (
                <li key={i}>
                  {[r.authors, r.title, r.journal,
                    r.year && r.volume_issue ? `${r.year}; ${r.volume_issue}` : r.year || '',
                    r.pages, r.doi_or_pmid].filter(Boolean).join('. ')}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  );
});
ReviewPrintView.displayName = 'ReviewPrintView';
export default ReviewPrintView;
