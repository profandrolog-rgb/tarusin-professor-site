import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseCsv } from "@/lib/treatmentCsv";

// Supported v9 columns (semicolon-delimited). Required: who_code.
// Optional: meridian_code (resolved -> meridian_id), pinyin, chinese, name_ru,
// location_description, depth_mm, indications, contraindications, is_caution,
// manipulation_default, svg_marker_x, svg_marker_y, svg_view.
const KNOWN = new Set([
  "who_code","meridian_code","pinyin","chinese","name_ru",
  "location_description","depth_mm","indications","contraindications",
  "is_caution","manipulation_default","svg_marker_x","svg_marker_y","svg_view",
]);
const NUMERIC = new Set(["svg_marker_x","svg_marker_y"]);
const BOOL = new Set(["is_caution"]);
const TRUE_VALS = new Set(["1","true","да","yes","y","+","x","✓"]);
const FALSE_VALS = new Set(["","0","false","нет","no","n","-"]);

type DupStrategy = "skip" | "update";

interface ParsedRow {
  index: number;
  payload: Record<string, any>;
  meridian_code?: string;
  errors: string[];
  warnings: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: () => void;
}

export function AcupointsCsvImportDialog({ open, onOpenChange, onComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dup, setDup] = useState<DupStrategy>("update");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: { row: number; msg: string }[] } | null>(null);

  const reset = () => { setHeaders([]); setRows([]); setFileName(""); setResult(null); if (fileRef.current) fileRef.current.value = ""; };

  const onFile = async (f: File) => {
    setResult(null);
    setFileName(f.name);
    const txt = await f.text();
    // try ; first then , 
    let matrix = parseCsv(txt, ";");
    if (matrix.length && matrix[0].length < 2) matrix = parseCsv(txt, ",");
    if (matrix.length < 2) { toast({ title: "CSV пуст", variant: "destructive" }); return; }
    const hdr = matrix[0].map(h => h.trim());
    setHeaders(hdr);
    const parsed: ParsedRow[] = matrix.slice(1).map((r, i) => {
      const errors: string[] = []; const warnings: string[] = [];
      const payload: Record<string, any> = {};
      let meridian_code: string | undefined;
      hdr.forEach((h, idx) => {
        const raw = (r[idx] ?? "").trim();
        if (!h) return;
        if (!KNOWN.has(h)) { if (raw) warnings.push(`unknown col ${h}`); return; }
        if (raw === "") return;
        if (h === "meridian_code") { meridian_code = raw; return; }
        if (NUMERIC.has(h)) {
          const v = Number(raw.replace(",", "."));
          if (!Number.isFinite(v)) { errors.push(`${h}: not number «${raw}»`); return; }
          payload[h] = v;
        } else if (BOOL.has(h)) {
          const lv = raw.toLowerCase();
          if (TRUE_VALS.has(lv)) payload[h] = true;
          else if (FALSE_VALS.has(lv)) payload[h] = false;
          else errors.push(`${h}: not bool «${raw}»`);
        } else {
          payload[h] = raw;
        }
      });
      if (!payload.who_code) errors.push("missing who_code");
      return { index: i + 2, payload, meridian_code, errors, warnings };
    });
    setRows(parsed);
  };

  const valid = useMemo(() => rows.filter(r => r.errors.length === 0), [rows]);
  const invalid = useMemo(() => rows.filter(r => r.errors.length > 0), [rows]);
  const preview = rows.slice(0, 10);

  const run = async () => {
    setRunning(true);
    const log: { row: number; msg: string }[] = [];
    let created = 0, updated = 0, skipped = 0;
    try {
      // Resolve meridian codes
      const codes = Array.from(new Set(valid.map(r => r.meridian_code).filter(Boolean) as string[]));
      const meridianMap = new Map<string, string>();
      if (codes.length) {
        const { data: mers } = await supabase.from("acupoint_meridians").select("id, code").in("code", codes);
        (mers || []).forEach((m: any) => meridianMap.set(m.code, m.id));
      }
      // Existing who_codes
      const allCodes = valid.map(r => r.payload.who_code as string);
      const existing = new Set<string>();
      if (allCodes.length) {
        const { data: ex } = await supabase.from("acupoints").select("who_code").in("who_code", allCodes);
        (ex || []).forEach((e: any) => existing.add(e.who_code));
      }
      for (const r of valid) {
        try {
          const p = { ...r.payload };
          if (r.meridian_code) {
            const mid = meridianMap.get(r.meridian_code);
            if (mid) p.meridian_id = mid;
            else log.push({ row: r.index, msg: `unknown meridian_code ${r.meridian_code}` });
          }
          const exists = existing.has(p.who_code);
          if (exists) {
            if (dup === "skip") { skipped++; continue; }
            const { error } = await supabase.from("acupoints").update(p).eq("who_code", p.who_code);
            if (error) log.push({ row: r.index, msg: error.message }); else updated++;
          } else {
            const { error } = await supabase.from("acupoints").insert(p);
            if (error) log.push({ row: r.index, msg: error.message }); else created++;
          }
        } catch (e: any) {
          log.push({ row: r.index, msg: e?.message || String(e) });
        }
      }
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
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5"/>Импорт CSV акупунктурных точек</DialogTitle>
          <DialogDescription>UTF-8, разделитель «;» или «,». Ключ: <b>who_code</b>. Колонки: meridian_code, pinyin, chinese, name_ru, location_description, depth_mm, indications, contraindications, is_caution, manipulation_default, svg_marker_x, svg_marker_y, svg_view.</DialogDescription>
        </DialogHeader>

        {!rows.length && !result && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">Выберите CSV-файл точек (v9)</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}/>
            <Button onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="w-4 h-4"/>Выбрать файл</Button>
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{fileName}</Badge>
              <Badge variant="secondary">всего: {rows.length}</Badge>
              <Badge className="bg-green-600 hover:bg-green-600 text-white">валидных: {valid.length}</Badge>
              {invalid.length > 0 && <Badge variant="destructive">с ошибками: {invalid.length}</Badge>}
            </div>

            <div>
              <Label className="text-sm font-semibold">При совпадении по who_code:</Label>
              <RadioGroup value={dup} onValueChange={(v: any) => setDup(v)} className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { v: "update", l: "Обновить", d: "перезаписать поля (рекомендуется)" },
                  { v: "skip", l: "Пропустить", d: "не трогать существующие" },
                ].map(o => (
                  <label key={o.v} className={`border rounded-md p-2 cursor-pointer flex items-start gap-2 text-sm ${dup === o.v ? "border-primary bg-primary/5" : ""}`}>
                    <RadioGroupItem value={o.v} className="mt-0.5"/>
                    <div><div className="font-medium">{o.l}</div><div className="text-xs text-muted-foreground">{o.d}</div></div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Превью (первые 10):</div>
              <div className="border rounded overflow-x-auto max-h-64">
                <table className="text-xs w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">№</th>
                      <th className="px-2 py-1 text-left">who_code</th>
                      <th className="px-2 py-1 text-left">мерид.</th>
                      <th className="px-2 py-1 text-left">pinyin</th>
                      <th className="px-2 py-1 text-left">name_ru</th>
                      <th className="px-2 py-1 text-left">SVG</th>
                      <th className="px-2 py-1 text-left">статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(r => (
                      <tr key={r.index} className="border-t">
                        <td className="px-2 py-1">{r.index}</td>
                        <td className="px-2 py-1 font-mono">{r.payload.who_code || "—"}</td>
                        <td className="px-2 py-1">{r.meridian_code || "—"}</td>
                        <td className="px-2 py-1">{r.payload.pinyin || "—"}</td>
                        <td className="px-2 py-1">{r.payload.name_ru || "—"}</td>
                        <td className="px-2 py-1">{r.payload.svg_marker_x != null ? `${r.payload.svg_marker_x},${r.payload.svg_marker_y ?? "?"}` : "—"}</td>
                        <td className="px-2 py-1">{r.errors.length ? <span className="text-destructive">{r.errors[0]}</span> : <span className="text-green-600 dark:text-green-400">OK</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {invalid.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-destructive font-medium">Строки с ошибками ({invalid.length})</summary>
                <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {invalid.slice(0, 50).map(r => <li key={r.index}>стр. {r.index}: {r.errors.join("; ")}</li>)}
                </ul>
              </details>
            )}

            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0"/>
              <div>Импорт выполняется построчно. Для 300+ точек может занять до минуты.</div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400"/><span className="font-semibold">Импорт завершён</span></div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Создано</div><div className="text-xl font-bold text-green-600 dark:text-green-400">{result.created}</div></div>
              <div className="border rounded p-2"><div className="text-xs text-muted-foreground">Обновлено</div><div className="text-xl font-bold text-blue-600 dark:text-blue-400">{result.updated}</div></div>
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
                Импортировать {valid.length}
              </Button>
            </>
          )}
          {result && <Button onClick={() => { onOpenChange(false); reset(); }}>Закрыть</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
