import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pill, Trash2, ArrowRight } from "lucide-react";
import { SECTIONS, type TreatmentCategory } from "@/components/treatment/sections";
import type { ParsedPlanItem, ActivePatientContext } from "@/lib/protocolBridge";
import { bucketForPlanItem, VISIT_BUCKET_LABEL, type VisitBucket } from "@/lib/visits/applyPlanItemsToAssignments";
import { PatientConfirmationBanner } from "./PatientConfirmationBanner";
import type { PatientSelection } from "./PatientPickerPopover";

export type EditableItem = ParsedPlanItem & { _id: string; _selected: boolean };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: EditableItem[];
  onItemsChange: (items: EditableItem[]) => void;
  loading?: boolean;
  patientName?: string | null;
  boundPatient?: PatientSelection;
  activeContext?: ActivePatientContext | null;
  onPatientChange?: (sel: PatientSelection) => void;
  onConfirm: (selected: ParsedPlanItem[]) => void;
}

const SECTION_OPTIONS = SECTIONS.map((s) => ({ value: s.key, label: s.label }));

export function PlanItemsPreviewDialog({
  open, onOpenChange, items, onItemsChange, loading, patientName,
  boundPatient, activeContext, onPatientChange, onConfirm,
}: Props) {
  const update = (id: string, patch: Partial<EditableItem>) => {
    onItemsChange(items.map((it) => (it._id === id ? { ...it, ...patch } : it)));
  };
  const remove = (id: string) => onItemsChange(items.filter((it) => it._id !== id));
  const toggleAll = (checked: boolean) =>
    onItemsChange(items.map((it) => ({ ...it, _selected: checked })));

  const grouped = SECTIONS.map((s) => ({
    section: s,
    rows: items.filter((it) => it.section_category === s.key),
  })).filter((g) => g.rows.length > 0);

  const selectedCount = items.filter((i) => i._selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Распределение назначений по плану лечения
          </DialogTitle>
          <DialogDescription>
            {patientName
              ? <>Будут добавлены в активный план: <span className="font-medium text-foreground">{patientName}</span></>
              : "Откройте план лечения пациента в соседней вкладке"}
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
            Анализирую фрагмент…
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
            Не удалось распознать назначения в выделенном фрагменте.
          </div>
        ) : (
          <>
            {(() => {
              const selectedItems = items.filter((i) => i._selected);
              const counts: Record<VisitBucket, number> = {
                examinations: 0, treatments: 0, referrals: 0, diet: 0, surgeries: 0, activity: 0,
              };
              for (const it of selectedItems) counts[bucketForPlanItem(it)]++;
              const kind = activeContext?.kind;
              const targetLabel =
                kind === "visit" ? "в визит"
                : kind === "ultrasound" ? "в УЗИ"
                : kind === "consultation" ? "в консультацию"
                : "в план лечения";
              return (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ArrowRight className="w-3 h-3" /> Предпросмотр распределения <span className="text-foreground font-medium">{targetLabel}</span>:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(counts) as VisitBucket[]).map((b) => (
                      <Badge
                        key={b}
                        variant={counts[b] > 0 ? "default" : "outline"}
                        className="text-[10px] h-5 px-1.5 font-normal"
                      >
                        {VISIT_BUCKET_LABEL[b]}: {counts[b]}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center justify-between border-b pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedCount === items.length}
                  onCheckedChange={(v) => toggleAll(v === true)}
                />
                Выбрать все ({selectedCount}/{items.length})
              </label>
            </div>

            <ScrollArea className="flex-1 pr-3 -mr-3">
              <div className="space-y-4">
                {grouped.map(({ section, rows }) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.key} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className="w-4 h-4" /> {section.label}
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{rows.length}</Badge>
                      </div>
                      {rows.map((it) => (
                        <div
                          key={it._id}
                          className="border rounded-md p-3 bg-card space-y-2 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={it._selected}
                              onCheckedChange={(v) => update(it._id, { _selected: v === true })}
                              className="mt-1"
                            />
                            <Input
                              value={it.name}
                              onChange={(e) => update(it._id, { name: e.target.value })}
                              className="flex-1 h-8 font-medium"
                            />
                            <Select
                              value={it.section_category}
                              onValueChange={(v) => update(it._id, { section_category: v as TreatmentCategory })}
                            >
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SECTION_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Badge variant="secondary" className="h-8 px-2 text-[10px] font-normal whitespace-nowrap shrink-0">
                              → {VISIT_BUCKET_LABEL[bucketForPlanItem(it)]}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(it._id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-7">
                            <Input
                              placeholder="Доза"
                              value={it.dose ?? ""}
                              onChange={(e) => {
                                const v = e.target.value.replace(",", ".");
                                update(it._id, { dose: v === "" ? null : parseFloat(v) || null });
                              }}
                              className="h-8"
                            />
                            <Input
                              placeholder="ед."
                              value={it.dose_unit ?? ""}
                              onChange={(e) => update(it._id, { dose_unit: e.target.value || null })}
                              className="h-8"
                            />
                            <Input
                              placeholder="Частота"
                              value={it.frequency ?? ""}
                              onChange={(e) => update(it._id, { frequency: e.target.value || null })}
                              className="h-8"
                            />
                            <Input
                              placeholder="Дней"
                              type="number"
                              value={it.duration_days ?? ""}
                              onChange={(e) => update(it._id, { duration_days: e.target.value ? parseInt(e.target.value) : null })}
                              className="h-8"
                            />
                          </div>
                          {it.notes && (
                            <div className="pl-7 text-xs text-muted-foreground italic">{it.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            onClick={() => {
              const selected = items.filter((i) => i._selected).map(({ _id, _selected, ...rest }) => rest);
              onConfirm(selected);
            }}
            disabled={loading || selectedCount === 0}
          >
            Отправить в план ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
