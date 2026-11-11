import { describe, expect, it } from 'vitest';
import { normalizeExtraction } from '../../supabase/functions/parse-medical-pdf/normalizeExtraction';

describe('medical import page normalization', () => {
  it('retains all nine parameters returned inside a document array', () => {
    const labs = Array.from({ length: 9 }, (_, i) => ({ analyte: `Parameter ${i}`, value: i }));
    expect(normalizeExtraction([{ document_type: 'lab', lab_results: labs }]).lab_results).toEqual(labs.map((v) => ({ ...v, document_date: null })));
  });
  it('merges pages without losing each page date or diagnoses', () => {
    const result = normalizeExtraction({ pages: [
      { document_date: '2026-11-01', lab_results: [{ analyte: 'A', value: 7 }], diagnoses: [{ text: 'A' }] },
      { document_date: '2026-11-02', lab_results: [{ analyte: 'B', value: 9 }] },
    ] });
    expect(result.lab_results.map((r) => [r.value, r.document_date])).toEqual([[7, '2026-11-01'], [9, '2026-11-02']]);
    expect(result.diagnoses).toEqual([{ text: 'A', date: '2026-11-01' }]);
  });
  it('keeps an ordinary single-document response', () => {
    expect(normalizeExtraction({ lab_results: [{ analyte: 'AMH', value: 4 }] }).lab_results[0].value).toBe(4);
  });
});