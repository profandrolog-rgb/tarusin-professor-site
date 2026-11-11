// Preserve page dates and every extracted row; do not invent missing measurements.
export function findLabMatch<T extends { _norm: string[] }>(catalog: T[], target: string): T | undefined {
  const exact = catalog.find((c) => c._norm.includes(target));
  if (exact) return exact;
  const qualifier = (s: string) => /свободн|free/.test(s) ? 'free' : /общий|общего|total/.test(s) ? 'total' : '';
  const candidates = catalog.filter((c) => c._norm.some((n) => qualifier(n) === qualifier(target) && n.length > 3 && target.length > 3 && (target.includes(n) || n.includes(target))));
  return candidates.length === 1 ? candidates[0] : undefined;
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