import pkg from "file-saver";
const { saveAs } = pkg;

function escapeCsv(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return "(нет данных)\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(";")];
  for (const r of rows) lines.push(headers.map((h) => escapeCsv(r[h])).join(";"));
  return lines.join("\n");
}

export interface CsvSection {
  title: string;
  rows: any[];
}

export function downloadAnalyticsCsv(filename: string, sections: CsvSection[]) {
  const parts: string[] = [];
  for (const s of sections) {
    parts.push(`=== ${s.title} ===`);
    parts.push(rowsToCsv(s.rows));
    parts.push("");
  }
  const blob = new Blob(["\uFEFF" + parts.join("\n")], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename);
}
