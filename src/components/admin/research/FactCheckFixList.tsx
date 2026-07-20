import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { RefinementEntry } from "@/lib/research/refinementDiff";

interface FcItem {
  marker?: string;
  claim?: string;
  reason?: string;
}

interface Props {
  content: string;
  factCheck: { not_found_in_source?: FcItem[] };
  onApply: (newContent: string, entry: RefinementEntry) => void;
}

interface FixState {
  accepted: boolean;
  edited: string;
}

export default function FactCheckFixList({ content, factCheck, onApply }: Props) {
  const items = useMemo(() => factCheck.not_found_in_source ?? [], [factCheck]);
  const [state, setState] = useState<Record<number, FixState>>(() =>
    Object.fromEntries(items.map((it, i) => [i, { accepted: false, edited: "" }])),
  );

  if (items.length === 0) return null;

  const acceptedCount = Object.values(state).filter((s) => s.accepted).length;

  function toggle(i: number, accepted: boolean) {
    setState((s) => ({ ...s, [i]: { ...(s[i] || { accepted: false, edited: "" }), accepted } }));
  }

  function setEdited(i: number, edited: string) {
    setState((s) => ({ ...s, [i]: { ...(s[i] || { accepted: false, edited: "" }), edited } }));
  }

  function applyAll() {
    let next = content;
    const applied: FcItem[] = [];
    const skipped: FcItem[] = [];
    items.forEach((it, i) => {
      const s = state[i];
      if (!s?.accepted) return;
      const original = (it.claim || "").trim();
      const replacement = (s.edited || "").trim();
      if (!original) return;
      if (next.includes(original)) {
        next = next.replace(original, replacement); // если replacement пуст — утверждение убирается
        applied.push(it);
      } else {
        skipped.push(it);
      }
    });
    if (applied.length === 0) {
      toast.error("Ни одно утверждение не найдено в тексте дословно. Отредактируйте вручную.");
      return;
    }
    const entry: RefinementEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      type: "fact_check_fix",
      instruction: `Применены правки факт-чека: ${applied.length} шт.`,
      previous_snapshot: content,
      note: applied.map((a) => `${a.marker || ""} ${a.claim}`).join("\n"),
    } as unknown as RefinementEntry;
    onApply(next, entry);
    toast.success(`Применено правок: ${applied.length}${skipped.length ? `, не найдено дословно: ${skipped.length}` : ""}`);
    // reset accepted flags for applied entries
    setState((s) => {
      const copy = { ...s };
      items.forEach((it, i) => {
        if (applied.includes(it)) copy[i] = { accepted: false, edited: "" };
      });
      return copy;
    });
  }

  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          Список правок факт-чека
          <Badge variant="destructive" className="ml-1">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it, i) => {
          const s = state[i] || { accepted: false, edited: "" };
          return (
            <div key={i} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">{it.marker || "—"}</Badge>
                  {it.reason && <span className="text-muted-foreground">Причина: {it.reason}</span>}
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={s.accepted}
                    onCheckedChange={(v) => toggle(i, Boolean(v))}
                  />
                  <Check className="w-3.5 h-3.5" /> Принять
                </label>
              </div>

              <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
                <div className="text-[10px] uppercase tracking-wide text-red-700 dark:text-red-400 mb-1">− До</div>
                <div className="text-sm">{it.claim}</div>
              </div>

              <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
                <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> + После (оставьте пустым, чтобы удалить утверждение)
                </div>
                <Textarea
                  value={s.edited}
                  onChange={(e) => setEdited(i, e.target.value)}
                  rows={2}
                  placeholder="Уточнённая формулировка либо пусто"
                  className="text-sm"
                />
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-1">
          <Button onClick={applyAll} disabled={acceptedCount === 0}>
            Применить принятые правки ({acceptedCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
