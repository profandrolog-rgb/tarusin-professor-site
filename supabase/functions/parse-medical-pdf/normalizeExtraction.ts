// Preserve page dates and every extracted row; do not invent missing measurements.
export function findLabMatch<T extends { _norm: string[] }>(catalog: T[], target: string): T | undefined {
  const exact = catalog.find((c) => c._norm.includes(target));
  if (exact) return exact;
  const qualifier = (s: string) => /тестостерон|testosterone/.test(s) ? (/свободн|free/.test(s) ? 'free' : 'total') : '';
  const base = (s: string) => s.replace(/свободный|свободного|free|общий|общего|total/g, '');
  const qualified = catalog.find((c) => c._norm.some((n) => qualifier(target) !== '' && qualifier(n) === qualifier(target) && base(n) === base(target)));
  if (qualified) return qualified;
  const candidates = catalog.map((item) => ({ item, score: Math.max(0, ...item._norm.map((n) => qualifier(n) === qualifier(target) && n.length > 3 && target.length > 3 && (target.includes(n) || n.includes(target)) ? Math.min(n.length, target.length) : 0)) })).filter((c) => c.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0] && candidates[0].score !== candidates[1]?.score ? candidates[0].item : undefined;
}

export function normalizeExtraction(input: unknown) {
  const documents: Record<string, any>[] = [];
  const collect = (value: unknown, inheritedDate: string | null = null) => {
    if (Array.isArray(value)) { value.forEach((item) => collect(item, inheritedDate)); return; }
    if (!value || typeof value !== 'object') return;
    const doc = value as Record<string, any>;
    const date = typeof doc.document_date === 'string' ? doc.document_date : inheritedDate;
    if (Array.isArray(doc.lab_results) || Array.isArray(doc.diagnoses) || doc.conclusion_text) documents.push({ ...doc, document_date: date });
    for (const key of ['pages', 'documents', 'results']) if (Array.isArray(doc[key])) collect(doc[key], date);
  };
  collect(input);
  return {
    document_type: documents.find((d) => d.document_type)?.document_type || 'other',
    document_date: documents.find((d) => d.document_date)?.document_date || null,
    lab_results: documents.flatMap((d) => (Array.isArray(d.lab_results) ? d.lab_results : []).filter((v: any) => v && typeof v === 'object').map((v: any) => ({ ...v, document_date: v.document_date || d.document_date }))),
    diagnoses: documents.flatMap((d) => (Array.isArray(d.diagnoses) ? d.diagnoses : []).filter((v: any) => v && typeof v === 'object').map((v: any) => ({ ...v, date: v.date || d.document_date }))),
    conclusion_text: documents.map((d) => d.conclusion_text).filter((v) => typeof v === 'string' && v.trim()).join('\n\n') || null,
  };
}