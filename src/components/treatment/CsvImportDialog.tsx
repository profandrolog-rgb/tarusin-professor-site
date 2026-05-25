import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseCsv, rowToPayload, CATALOG_KNOWN_COLUMNS } from "@/lib/treatmentCsv";

type DupStrategy = "skip" | "update" | "create";

interface ParsedRow {
  index: number; // 1-based source row index (excluding header)
  payload: Record<string, any>;
  errors: string[];
  warnings: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: () => void;
}

export function CsvImportDialog({ open, onOpenChange, onComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dup, setDup] = useState<DupStrategy>("skip");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: { row: number; msg: string }[] } | null>(null);

  const reset = () => { setHeaders([]); setRows([]); setFileName(""); setResult(null); if (fileRef.current) fileRef.current.value = ""; };

  const onFile = async (f: File) => {
    setResult(null);
    setFileName(f.name);
    const txt = await f.text();
    const matrix = parseCsv(txt, ";");
    if (matrix.length < 2) { toast({ title: "CSV пуст или нет строк данных", variant: "destructive" }); return; }
    const hdr = matrix[0].map(h => h.trim());
    setHeaders(hdr);
    const parsed: ParsedRow[] = matrix.slice(1).map((r, i) => {
      const { payload, errors, warnings } = rowToPayload(hdr, r);
      return { index: i + 2, payload, errors, warnings };
    });
    setRows(parsed);
  };

  const valid = useMemo(() => rows.filter(r => r.errors.length === 0), [rows]);
  const invalid = useMemo(() => rows.filter(r => r.errors.length > 0), [rows]);
  const preview = rows.slice(0, 10);

  const unknownCols = useMemo(() => {
    const known = new Set([...CATALOG_KNOWN_COLUMNS as readonly string[]]);
    return headers.filter(h => h && !known.has(h) && !h.startsWith("patient_"));
  }, [headers]);

  const run = async () => {
    setRunning(true);
    const log: { row: number; msg: string }[] = [];
    let created = 0, updated = 0, skipped = 0;

    try {
      for (const r of valid) {
        try {
          const p = r.payload;
          // Find duplicate
          let q = supabase.from("treatment_catalog").select("id").eq("name", p.name);
          q = p.inn ? q.eq("inn", p.inn) : q.is("inn", null);
          q = p.default_dose != null ? q.eq("default_dose", p.default_dose) : q.is("default_dose", null);
          q = p.dose_unit ? q.eq("dose_unit", p.dose_unit) : q.is("dose_unit", null);
          const { data: dupes } = await q.limit(1);
          const exists = dupes && dupes.length > 0;

          if (exists) {
            if (dup === "skip") { skipped++; continue; }
            if (dup === "update") {
              const { error } = await supabase.from("treatment_catalog").update(p as any).eq("id", dupes[0].id);
              if (error) { log.push({ row: r.index, msg: error.message }); }
              else updated++;
              continue;
            }
            // dup === "create" → fall through to insert
          }
          const { error } = await supabase.from("treatment_catalog").insert(p as any);
          if (error) log.push({ row: r.index, msg: error.message });
          else created++;
        } catch (e: any) {
          log.push({ row: r.index, msg: e?.message || String(e) });
        }
      }
      // Add errored (validation) rows to log
      for (const r of invalid) log.push({ row: r.index, msg: r.errors.join("; ") });

      setResult({ created, updated, skipped, errors: log });
      onComplete();
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5"/>Импорт CSV</DialogTitle>
          <DialogDescription>UTF-8, разделитель «;», CRLF. Мэппинг по заголовкам. Поля patient_* собираются в JSON.</DialogDescription>
        </DialogHeader>

        {!rows.length && !result && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">Выберите CSV-файл каталога</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}/>
            <Button onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="w-4 h-4"/>Выбрать файл</Button>
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{fileName}</Badge>
              <Badge variant="secondary">всего строк: {rows.length}</Badge>
              <Badge className="bg-green-600 hover:bg-green-600 text-white">валидных: {valid.length}</Badge>
              {invalid.length > 0 && <Badge variant="destructive">с ошибками: {invalid.length}</Badge>}
            </div>

            {unknownCols.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0"/>
                <div>Неизвестные столбцы (будут проигнорированы): {unknownCols.join(", ")}</div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold">При совпадении (name + inn + default_dose + dose_unit):</Label>
              <RadioGroup value={dup} onValueChange={(v: any) => setDup(v)} className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { v: "skip", l: "Пропустить", d: "по умолчанию" },
                  { v: "update", l: "Обновить", d: "перезаписать поля" },
                  { v: "create", l: "Создать новое", d: "добавить дубль" },
                ].map(o => (
                  <label key={o.v} className={`border rounded-md p-2 cursor-pointer flex items-start gap-2 text-sm ${dup === o.v ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value={o.v} className="mt-0.5"/>
                    <div><div className="font-medium">{o.l}</div><div className="text-xs text-muted-foreground">{o.d}</div></div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Превью первых 10 строк:</div>
              <div className="border rounded overflow-x-auto max-h-64">
                <table className="text-xs w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">№</th>
                      <th className="px-2 py-1 text-left">category</th>
                      <th className="px-2 py-1 text-left">name</th>
                      <th className="px-2 py-1 text-left">inn</th>
                      <th className="px-2 py-1 text-left">доза</th>
                      <th className="px-2 py-1 text-left">статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(r => (
                      <tr key={r.index} className="border-t">
                        <td className="px-2 py-1">{r.index}</td>
                        <td className="px-2 py-1">{r.payload.category || "—"}</td>
                        <td className="px-2 py-1">{r.payload.name || "—"}</td>
                        <td className="px-2 py-1">{r.payload.inn || "—"}</td>
                        <td className="px-2 py-1">{r.payload.default_dose ?? ""} {r.payload.dose_unit ?? ""}</td>
                        <td className="px-2 py-1">{r.errors.length ? <span className="text-destructive">{r.errors[0]}</span> : <span className="text-green-600 dark:text-green-400">OK</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {invalid.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-destructive font-medium">Показать строки с ошибками ({invalid.length})</summary>
                <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {invalid.slice(0, 50).map(r => <li key={r.index}>стр. {r.index}: {r.errors.join("; ")}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600"/><span className="font-semibold">Импорт завершён</span></div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Создано</div><div className="text-xl font-bold text-green-600">{result.created}</div></div>
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Обновлено</div><div className="text-xl font-bold text-blue-600">{result.updated}</div></div>
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Пропущено</div><div className="text-xl font-bold">{result.skipped}</div></div>
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Ошибок</div><div className="text-xl font-bold text-destructive">{result.errors.length}</div></div>
            </div>
            {result.errors.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm text-destructive">Показать ошибки</summary>
                <ul className="text-xs mt-2 space-y-0.5 max-h-60 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>стр. {e.row}: {e.msg}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        <DialogFooter>
          {rows.length > 0 && !result && (
            <>
              <Button variant="ghost" onClick={reset} disabled={running}>Сбросить</Button>
              <Button onClick={run} disabled={running || valid.length === 0} className="gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                Импортировать {valid.length} {valid.length === 1 ? "позицию" : "позиций"}
              </Button>
            </>
          )}
          {result && <Button onClick={() => { onOpenChange(false); reset(); }}>Закрыть</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
