import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Loader2, Pill, Trash2, FileText } from "lucide-react";
import type { ParsedRxItem } from "@/lib/protocolBridge";

export type EditableRxItem = ParsedRxItem & { _id: string; _selected: boolean };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EditableRxItem[];
  onItemsChange: (items: EditableRxItem[]) => void;
  loading?: boolean;
  patientName?: string | null;
  onConfirm: (selected: ParsedRxItem[]) => void;
}

export function RxItemsPreviewDialog({
  open, onOpenChange, items, onItemsChange, loading, patientName, onConfirm,
}: Props) {
  const update = (id: string, patch: Partial<EditableRxItem>) => {
    onItemsChange(items.map((it) => (it._id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onItemsChange(items.filter((it) => it._id !== id));
  const toggleAll = (checked: boolean) =>
    onItemsChange(items.map((it) => ({ ...it, _selected: checked })));

  const selectedCount = items.filter((i) => i._selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Формирование рецептов (форма 107-1/у)
          </DialogTitle>
          <DialogDescription>
            {patientName
              ? <>Пациент: <span className="font-medium text-foreground">{patientName}</span>. Каждый отмеченный препарат → отдельный бланк.</>
              : "Каждый отмеченный препарат будет выписан на отдельном бланке."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Извлекаю препараты из фрагмента…
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
            Препараты не распознаны в выделенном фрагменте.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedCount === items.length}
                  onCheckedChange={(v) => toggleAll(v === true)}
                />
                Выбрать все ({selectedCount}/{items.length})
              </label>
              <span className="text-xs text-muted-foreground">Будет создано бланков: {selectedCount}</span>
            </div>
            <ScrollArea className="flex-1 pr-3 -mr-3">
              <div className="space-y-3 py-2">
                {items.map((it, idx) => (
                  <div key={it._id} className="border rounded-md p-3 bg-card space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={it._selected}
                        onCheckedChange={(v) => update(it._id, { _selected: v === true })}
                        className="mt-1"
                      />
                      <div className="shrink-0 mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> №{idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Rp: (латинское наименование)</Label>
                          <Input
                            value={it.medication_latin_name}
                            onChange={(e) => update(it._id, { medication_latin_name: e.target.value })}
                            className="h-8 font-medium"
                          />
                        </div>
                        {it.medication_ru_name && (
                          <div className="text-xs text-muted-foreground pl-1">{it.medication_ru_name}</div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Форма</Label>
                            <Input
                              value={it.dosage_form}
                              onChange={(e) => update(it._id, { dosage_form: e.target.value })}
                              placeholder="tabulettae"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Доза</Label>
                            <Input
                              value={it.dose}
                              onChange={(e) => update(it._id, { dose: e.target.value })}
                              placeholder="500 мг"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">D.t.d. N</Label>
                            <Input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => update(it._id, { quantity: parseInt(e.target.value) || 1 })}
                              className="h-8"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-[11px] text-muted-foreground">Кратность (S.)</Label>
                            <Input
                              value={it.frequency}
                              onChange={(e) => update(it._id, { frequency: e.target.value })}
                              placeholder="по 1 табл. 3 р/день"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Длительность</Label>
                            <Input
                              value={it.duration}
                              onChange={(e) => update(it._id, { duration: e.target.value })}
                              placeholder="7 дней"
                              className="h-8"
                            />
                          </div>
                        </div>
                        {it.signa && (
                          <div className="text-xs text-muted-foreground italic">S.: {it.signa}</div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(it._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            onClick={() => {
              const selected = items
                .filter((i) => i._selected)
                .map(({ _id, _selected, ...rest }) => rest);
              onConfirm(selected);
            }}
            disabled={loading || selectedCount === 0}
          >
            Открыть форму рецептов ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
