import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pill, Trash2, FileText, Sparkles, AlertTriangle, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { ParsedRxItem, ActivePatientContext } from "@/lib/protocolBridge";
import { PatientConfirmationBanner } from "./PatientConfirmationBanner";
import type { PatientSelection } from "./PatientPickerPopover";
import {
  normalizeRxItems, needsRxLookup, hasCyrillicLatinName, type RxSource,
} from "@/lib/prescriptions/normalizeRx";

export type EditableRxItem = ParsedRxItem & {
  _id: string;
  _selected: boolean;
  /** Требуется уточнение латыни/формы (препарат вписан вручную). */
  _needsLookup?: boolean;
  _source?: RxSource;
  /** Исходная строка назначения — контекст для нормализации. */
  _rawText?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EditableRxItem[];
  onItemsChange: (items: EditableRxItem[]) => void;
  loading?: boolean;
  patientName?: string | null;
  boundPatient?: PatientSelection;
  activeContext?: ActivePatientContext | null;
  onPatientChange?: (sel: PatientSelection) => void;
  onConfirm: (selected: ParsedRxItem[]) => void;
}

const SOURCE_LABEL: Record<RxSource, string> = {
  catalog: "из каталога",
  cache: "из справочника",
  ai: "уточнено ИИ — проверьте",
  none: "не распознано",
};

export function RxItemsPreviewDialog({
  open, onOpenChange, items, onItemsChange, loading, patientName,
  boundPatient, activeContext, onPatientChange, onConfirm,
}: Props) {
  const [normalizing, setNormalizing] = useState<string[]>([]);
  const autoDone = useRef(false);

  const update = (id: string, patch: Partial<EditableRxItem>) => {
    onItemsChange(items.map((it) => (it._id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onItemsChange(items.filter((it) => it._id !== id));
  const toggleAll = (checked: boolean) =>
    onItemsChange(items.map((it) => ({ ...it, _selected: checked })));

  const selectedCount = items.filter((i) => i._selected).length;

  const runNormalize = async (targets: EditableRxItem[]) => {
    if (targets.length === 0) return;
    setNormalizing(targets.map((t) => t._id));
    try {
      const normalized = await normalizeRxItems(
        targets.map((t) => ({
          name: t.medication_ru_name || t.medication_latin_name,
          raw_text: t._rawText ?? t.signa ?? null,
          dose: t.dose || null,
          frequency: t.frequency || null,
          duration: t.duration || null,
          dosage_form: t.dosage_form || null,
          quantity: t.quantity || null,
        })),
      );
      if (!normalized) {
        toast.error("Не удалось уточнить препараты", {
          description: "Поля можно заполнить вручную.",
        });
        return;
      }
      const byId = new Map(targets.map((t, i) => [t._id, normalized[i]]));
      onItemsChange(
        items.map((it) => {
          const n = byId.get(it._id);
          if (!n) return it;
          return {
            ...it,
            medication_ru_name: n.medication_ru_name || it.medication_ru_name,
            medication_latin_name: n.medication_latin_name || it.medication_latin_name,
            dosage_form: n.dosage_form || it.dosage_form,
            dose: n.dose || it.dose,
            quantity: n.quantity || it.quantity,
            frequency: n.frequency || it.frequency,
            duration: n.duration || it.duration,
            signa: n.signa ?? it.signa,
            _source: n.source,
            _needsLookup: false,
          };
        }),
      );
    } finally {
      setNormalizing([]);
    }
  };

  // Автоматическое уточнение позиций, вписанных вручную.
  useEffect(() => {
    if (!open) { autoDone.current = false; return; }
    if (autoDone.current || loading || items.length === 0) return;
    const targets = items.filter((it) => it._needsLookup ?? needsRxLookup(it));
    if (targets.length === 0) return;
    autoDone.current = true;
    void runNormalize(targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, items.length]);

  const cyrillicWarnings = items.filter(
    (i) => i._selected && hasCyrillicLatinName(i.medication_latin_name),
  ).length;


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

        {boundPatient && (
          <PatientConfirmationBanner
            boundPatient={boundPatient}
            activeContext={activeContext}
            onPatientChange={onPatientChange}
          />
        )}


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
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Будет создано бланков: {selectedCount}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={normalizing.length > 0}
                  onClick={() => void runNormalize(items)}
                >
                  {normalizing.length > 0
                    ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                  Уточнить все
                </Button>
              </div>
            </div>
            {cyrillicWarnings > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Латинское наименование не заполнено у {cyrillicWarnings} позиц. — бланк 107-1/у нельзя печатать по-русски.
                Нажмите «Уточнить» или впишите латынь вручную.
              </div>
            )}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {it._source && (
                            <Badge
                              variant="outline"
                              className={
                                it._source === "ai"
                                  ? "text-[10px] border-amber-500/60 text-amber-700 dark:text-amber-400"
                                  : it._source === "none"
                                    ? "text-[10px] border-destructive/60 text-destructive"
                                    : "text-[10px]"
                              }
                            >
                              {it._source === "ai" && <Sparkles className="w-3 h-3 mr-1" />}
                              {SOURCE_LABEL[it._source]}
                            </Badge>
                          )}
                          {normalizing.includes(it._id) && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> уточняю…
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2 ml-auto"
                            disabled={normalizing.length > 0}
                            onClick={() => void runNormalize([it])}
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            Уточнить
                          </Button>
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Rp: (латинское наименование)</Label>
                          <Input
                            value={it.medication_latin_name}
                            onChange={(e) => update(it._id, { medication_latin_name: e.target.value, _source: undefined })}
                            className={`h-8 font-medium ${hasCyrillicLatinName(it.medication_latin_name) ? "border-amber-500" : ""}`}
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
