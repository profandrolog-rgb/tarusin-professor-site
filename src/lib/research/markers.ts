// Утилиты для работы с маркерами источников [M1], [M2]… в тексте обзора.

const MARKER_RE = /\[M\d+\]/g;

export function countMarkers(html: string): number {
  return (html || '').match(MARKER_RE)?.length ?? 0;
}

export function collectMarkers(html: string): string[] {
  const set = new Set<string>();
  for (const m of (html || '').matchAll(MARKER_RE)) set.add(m[0]);
  return Array.from(set).sort((a, b) => {
    const na = parseInt(a.slice(2, -1), 10);
    const nb = parseInt(b.slice(2, -1), 10);
    return na - nb;
  });
}

export function stripMarkers(html: string): string {
  return (html || '').replace(/\s*\[M\d+\]/g, '').replace(/\s{2,}/g, ' ');
}

/** Оборачивает маркеры в <span class="source-marker" data-marker="[M2]">[M2]</span> для подсветки в редакторе/предпросмотре. */
export function highlightMarkers(html: string): string {
  return (html || '').replace(
    MARKER_RE,
    (m) => `<span class="source-marker" data-marker="${m}">${m}</span>`,
  );
}
