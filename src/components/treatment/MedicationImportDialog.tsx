import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";

interface Medication {
  id: string;
  latin_name: string;
  trade_name: string | null;
  dosage_form: string | null;
  dosage: string | null;
}

interface DraftValues {
  name?: string | null;
  inn?: string | null;
  form?: string | null;
  default_dose?: number | null;
  dose_unit?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: DraftValues;
  onApply: (patch: DraftValues) => void;
}

/** Parse "500 мг" -> {dose: 500, unit: "мг"} */
function parseDosage(s: string | null | undefined): { dose: number | null; unit: string | null } {
  if (!s) return { dose: null, unit: null };
  const m = s.trim().match(/^(\d+(?:[.,]\d+)?)\s*([^\s\d].*)?$/);
  if (!m) return { dose: null, unit: null };
  return { dose: Number(m[1].replace(",", ".")), unit: (m[2] || "").trim() || null };
}

const FIELD_LABELS: Record<keyof DraftValues, string> = {
  name: "Название",
  inn: "МНН",
  form: "Форма",
  default_dose: "Доза",
  dose_unit: "Ед. дозы",
};

export function MedicationImportDialog({ open, onOpenChange, current, onApply }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Medication | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [proposed, setProposed] = useState<DraftValues>({});

  useEffect(() => {
    if (!open) {
      setQ(""); setResults([]); setPicked(null); setChecks({}); setProposed({});
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase
        .from("medications")
        .select("id, latin_name, trade_name, dosage_form, dosage")
        .or(`latin_name.ilike.%${q}%,trade_name.ilike.%${q}%`)
        .limit(15);
      setResults((data as any) || []);
      setBusy(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (m: Medication) => {
    setPicked(m);
    const parsed = parseDosage(m.dosage);
    const p: DraftValues = {
      name: m.trade_name || m.latin_name,
      inn: m.latin_name,
      form: m.dosage_form,
      default_dose: parsed.dose,
      dose_unit: parsed.unit,
    };
    setProposed(p);
    // Default: only fields that are empty in current are checked
    const c: Record<string, boolean> = {};
    (Object.keys(p) as (keyof DraftValues)[]).forEach(k => {
      const cur = current[k];
      const isEmpty = cur === null || cur === undefined || cur === "" || (typeof cur === "number" && Number.isNaN(cur));
      c[k] = isEmpty && p[k] !== null && p[k] !== undefined && p[k] !== "";
    });
    setChecks(c);
  };

  const apply = () => {
    if (!picked) return;
    const patch: DraftValues = {};
    (Object.keys(proposed) as (keyof DraftValues)[]).forEach(k => {
      if (checks[k]) (patch as any)[k] = proposed[k];
    });
    onApply(patch);
    onOpenChange(false);
  };

  const fmt = (v: any) => v === null || v === undefined || v === "" ? "—" : String(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импорт из справочника рецептов</DialogTitle>
          <DialogDescription>Поиск по латинскому или торговому названию.</DialogDescription>
        </DialogHeader>

        {!picked && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Минимум 2 символа..."
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="border rounded max-h-72 overflow-y-auto">
              {busy && <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></div>}
              {!busy && q.trim().length >= 2 && results.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Ничего не найдено</div>
              )}
              {results.map(m => (
                <button
                  key={m.id}
                  className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0"
                  onClick={() => pick(m)}
                >
                  <div className="font-medium">{m.trade_name || m.latin_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.latin_name}{m.dosage_form ? ` · ${m.dosage_form}` : ""}{m.dosage ? ` · ${m.dosage}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {picked && (
          <div className="space-y-3">
            <div className="text-sm">Выбрано: <b>{picked.trade_name || picked.latin_name}</b></div>
            <div className="text-xs text-muted-foreground">
              Снимите галочки с полей, которые НЕ нужно перезаписывать. По умолчанию защищены уже заполненные поля.
            </div>
            <div className="border rounded divide-y">
              {(Object.keys(proposed) as (keyof DraftValues)[]).map(k => {
                const cur = current[k];
                const next = proposed[k];
                const same = String(cur ?? "") === String(next ?? "");
                if (next === null || next === undefined || next === "") return null;
                return (
                  <label key={k} className="flex items-start gap-3 p-2 cursor-pointer">
                    <Checkbox
                      checked={!!checks[k]}
                      onCheckedChange={(v) => setChecks(c => ({ ...c, [k]: !!v }))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{FIELD_LABELS[k]}</div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">{fmt(cur)}</span>
                        {" → "}
                        <span className={same ? "text-muted-foreground" : "text-primary font-medium"}>{fmt(next)}</span>
                        {same && <span className="ml-1 text-muted-foreground">(без изменений)</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>← Выбрать другой</Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          {picked && <Button onClick={apply}>Применить</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
