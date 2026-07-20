import { forwardRef } from 'react';
import { stripMarkers } from '@/lib/research/markers';

interface Props {
  title: string;
  annotation?: string;
  content: string;
  references: any[];
  authorName?: string;
}

/** Скрытый DOM-узел для печати. Виден только при @media print. */
const ReviewPrintView = forwardRef<HTMLDivElement, Props>(({ title, annotation, content, references, authorName }, ref) => {
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
        <section dangerouslySetInnerHTML={{ __html: stripMarkers(content || '') }} />
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
