import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { pushPendingRxItems, type ParsedRxItem } from "@/lib/protocolBridge";

interface Props {
  treatments: string[];
  patientId?: string | null;
  patientName?: string | null;
}

// Эвристика: исключаем БАДы, пептиды, процедуры, физиотерапию, гомеопатию,
// диету, режим — всё, что не выписывается на бланке 107-1/у.
const NON_RX_PATTERNS = [
  /бад\b/i, /добавк/i, /пептид/i, /процедур/i, /физиотерап/i,
  /массаж/i, /магнит/i, /узт\b/i, /электрофорез/i, /дарсонвал/i,
  /лазер/i, /ванн/i, /душ\b/i, /грязе/i,
  /диет/i, /режим/i, /пища/i, /гомеопат/i,
  /консультац/i, /осмотр/i, /контроль/i,
];

function isRxLine(s: string): boolean {
  const txt = s.trim();
  if (!txt) return false;
  return !NON_RX_PATTERNS.some((re) => re.test(txt));
}

function parseLineToRx(line: string): ParsedRxItem {
  // Простой парсер: первое слово/фраза до запятой/числа — название препарата.
  // Остальное — сигнатура.
  const t = line.trim().replace(/^[•\-\d.\)\s]+/, "");
  const m = t.match(/^([A-Za-zА-Яа-яЁё\-\s]+?)(?:\s+(\d|\(|по\s)|,|$)/);
  const name = (m?.[1] || t).trim();
  return {
    medication_ru_name: name,
    medication_latin_name: name,
    dosage_form: "",
    dose: "",
    quantity: 1,
    frequency: "",
    duration: "",
    signa: t.length > name.length ? t.slice(name.length).trim().replace(/^,?\s*/, "") : null,
  };
}

export function WriteRxFromAssignments({ treatments, patientId, patientName }: Props) {
  const [open, setOpen] = useState(false);
  const candidates = useMemo(() => treatments.filter(isRxLine), [treatments]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const openDialog = () => {
    if (candidates.length === 0) {
      toast.info("В назначениях нет препаратов в аптечной форме", {
        description: "БАДы, пептиды, физиотерапия и режим выписке на бланке не подлежат.",
      });
      return;
    }
    const init: Record<number, boolean> = {};
    candidates.forEach((_, i) => (init[i] = true));
    setSelected(init);
    setOpen(true);
  };

  const confirm = () => {
    const picked = candidates.filter((_, i) => selected[i]);
    if (picked.length === 0) {
      toast.error("Не выбрано ни одного препарата");
      return;
    }
    const items = picked.map(parseLineToRx);
    pushPendingRxItems(items, patientId ?? undefined);
    setOpen(false);
    const url = `/admin/prescriptions${patientId ? `?patientId=${patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(
      `${items.length} бланк(ов) отправлено в выписку${patientName ? ` — ${patientName}` : ""}`,
      { description: "Откройте вкладку «Рецепты», уточните дозы и печатайте." },
    );
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        <FileText className="h-4 w-4 mr-2" />
        Выписать рецепты{candidates.length > 0 ? ` (${candidates.length})` : ""}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выписать рецепты на препараты</DialogTitle>
            <DialogDescription>
              Отметьте препараты, на которые нужно сформировать бланки 107-1/у.
              Дозу, кратность и длительность можно будет уточнить в форме рецепта.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto border rounded p-3 space-y-2">
            {candidates.map((t, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox
                  checked={!!selected[i]}
                  onCheckedChange={(v) => setSelected((p) => ({ ...p, [i]: v === true }))}
                  className="mt-0.5"
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            <Button onClick={confirm}>
              <FileText className="h-4 w-4 mr-2" />
              Отправить в выписку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
